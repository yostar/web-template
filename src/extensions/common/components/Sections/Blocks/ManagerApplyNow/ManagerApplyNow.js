import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { FilePenLine } from 'lucide-react';
import { FormattedMessage } from '../../../../../../util/reactIntl';
import ModalIframeButton from '../../../ModalIframeButton/ModalIframeButton';

import css from './ManagerApplyNow.module.css';

const AgentApplyNow = () => {

const [agentEmail, setAgentEmail] = useState('');
const [referrer, setReferrer] = useState('');

    useEffect(() => {
   
        // Get promo code from URL if it exists, otherwise check cookie
        //if the value is set, make the field readonly
        const params = new URLSearchParams(window.location.search);
        if( params.get('agentEmail') ) {
            setAgentEmail(params.get('agentEmail') );
        }
        if( params.get('referrer') ) {
            setReferrer(params.get('referrer') );
        }
    }, []);

    return (
        <div className={css.root}>
            <ModalIframeButton 
                iframeUrl={`https://link.vendingvillage.com/manager-application-form?agentEmail=${agentEmail}&referrer=${referrer}`} 
                buttonLabel={<FormattedMessage id="ManagerApplyNow.buttonLabel" />} 
                icon={FilePenLine}
                buttonClassName="primaryButton"
            />
        </div>
    )
}

export default AgentApplyNow;